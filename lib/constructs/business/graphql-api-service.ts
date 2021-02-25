import * as cdk from "@aws-cdk/core";
import {
    EnumType,
    GraphqlApi,
    InputType,
    MappingTemplate,
    ObjectType,
    ResolvableField,
    Resolver,
} from "@aws-cdk/aws-appsync";
import {IUserPool} from "@aws-cdk/aws-cognito";
import {ITable} from "@aws-cdk/aws-dynamodb";

import {
    generateConnectionAndEdge,
    int,
    list_int,
    list_of,
    list_string,
    required,
    required_string,
    string,
} from "../../utils/appsync";
import {AbstractGraphqlEndpoint} from "./api-endpoint";


export interface GraphqlApiServiceProps {

    apiEndpoint: GraphqlApi;

    dataSource: ITable;

    auth?: IUserPool;
}

export abstract class AbstractGraphqlApiService extends cdk.Construct {

    abstract readonly resolvers: { [name: string]: Resolver } = {};

    protected constructor(scope: AbstractGraphqlEndpoint, id: string, props: GraphqlApiServiceProps) {
        super(scope, id);
    }
}

export class SyllabusApiService extends cdk.Construct {

    readonly resolvers: { [name: string]: Resolver } = {};

    constructor(scope: AbstractGraphqlEndpoint, id: string, props: GraphqlApiServiceProps) {
        super(scope, id);

        const dataSource = props.apiEndpoint.addDynamoDbDataSource('dynamo-db', props.dataSource, {
            description: "Syllabus table from DynamoDB.",
            name: "SyllabusTable",
        });

        const schoolType = new EnumType('School', {
            definition: [
                "PSE", "FSE", "SSS", "SILS", "CSE", "ASE", "LAW", "CMS", "HSS", "EDU", "SOC", "HUM", "SPS", "CJL",
                "GEC", "CIE", "ART", "G_SPS", "G_SE", "G_LAW", "G_LAS", "G_SC", "G_EDU", "G_HUM", "G_SSS", "G_SAPS",
                "G_ITS", "G_SJAL", "G_IPS", "G_WLS", "G_SA", "G_SPS", "G_FSE", "G_ASE", "G_CSE", "G_SEEE", "G_WBS",
                "G_SICCS",
            ],
        });
        const evalType = new ObjectType("Evaluation", {
            definition: {
                type: int,
                percent: int,
                criteria: string,
            },
        });
        const occurrenceType = new ObjectType("Occurrence", {
            definition: {
                day: int,
                period: int,
                location: string,
            },
        });
        const courseType = new ObjectType("Course", {
            definition: {
                id: string,
                category: string,
                code: string,
                credit: int,
                evals: list_of(evalType),
                instructor: string,
                lang: list_int,
                level: int,
                minYear: int,
                occurrences: list_of(occurrenceType),
                school: schoolType.attribute(),
                subtitle: string,
                term: string,
                title: string,
                title_jp: string,
                type: int,
            },
        });

        const evalFilter = new InputType("EvalFilter", {
            definition: {
                type: int,
                percent: int,
            },
        });
        const filterForm = new InputType("FilterForm", {
            definition: {
                semester: list_string,
                lang: list_int,
                day: list_int,
                period: list_int,
                min_year: list_int,
                credit: list_int,
                eval: list_of(evalFilter),
                type: list_int,
                level: list_int,
            },
        });

        const courseConnection = generateConnectionAndEdge({base: courseType, target: courseType}).connection;
        const courseEdge = generateConnectionAndEdge({base: courseType, target: courseType}).edge;

        [schoolType, evalType, occurrenceType, courseType, evalFilter, filterForm, courseConnection, courseEdge].forEach(
            (type) => props.apiEndpoint.addType(type),
        );

        props.apiEndpoint.addQuery('getCourses', new ResolvableField({
            returnType: list_of(courseType),
            dataSource: dataSource,
            args: {
                id: required_string,
            },
            requestMappingTemplate: MappingTemplate.dynamoDbGetItem('id', 'id'),
            responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
        }));
        props.apiEndpoint.addQuery('filterCourses', new ResolvableField({
            returnType: courseConnection.attribute(),
            dataSource: dataSource,
            args: {
                form: required(filterForm),
                after: string,
                first: int,
                before: string,
                last: int,
            },
            requestMappingTemplate: MappingTemplate.fromFile('src/appsync/mapping/syllabus-filter-req.vtl'),
            responseMappingTemplate: MappingTemplate.dynamoDbResultList(),
        }));
    }
}

export abstract class CareerApiService extends cdk.Construct {

    abstract readonly resolvers: { [name: string]: Resolver } = {};

    protected constructor(scope: AbstractGraphqlEndpoint, id: string, props: GraphqlApiServiceProps) {
        super(scope, id);
    }
}