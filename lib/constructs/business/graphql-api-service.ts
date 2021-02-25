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
    PageInfo,
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

        const School = new EnumType('School', {
            definition: [
                "PSE", "FSE", "SSS", "SILS", "CSE", "ASE", "LAW", "CMS", "HSS", "EDU", "SOC", "HUM", "SPS", "CJL",
                "GEC", "CIE", "ART", "G_SPS", "G_SE", "G_LAW", "G_LAS", "G_SC", "G_EDU", "G_HUM", "G_SSS", "G_SAPS",
                "G_ITS", "G_SJAL", "G_IPS", "G_WLS", "G_SA", "G_SPS", "G_FSE", "G_ASE", "G_CSE", "G_SEEE", "G_WBS",
                "G_SICCS",
            ],
        });
        const Eval = new ObjectType("Evaluation", {
            definition: {
                type: int,
                percent: int,
                criteria: string,
            },
        });
        const Occurrence = new ObjectType("Occurrence", {
            definition: {
                day: int,
                period: int,
                location: string,
            },
        });
        const Course = new ObjectType("Course", {
            definition: {
                id: string,
                category: string,
                code: string,
                credit: int,
                evals: list_of(Eval),
                instructor: string,
                lang: list_int,
                level: int,
                minYear: int,
                occurrences: list_of(Occurrence),
                school: School.attribute(),
                subtitle: string,
                term: string,
                title: string,
                title_jp: string,
                type: int,
            },
        });

        const EvalFilter = new InputType("EvalFilter", {
            definition: {
                type: int,
                percent: int,
            },
        });
        const FilterForm = new InputType("FilterForm", {
            definition: {
                semester: list_string,
                lang: list_int,
                day: list_int,
                period: list_int,
                min_year: list_int,
                credit: list_int,
                eval: list_of(EvalFilter),
                type: list_int,
                level: list_int,
            },
        });

        const CourseConnection = generateConnectionAndEdge({base: Course, target: Course}).connection;
        const CourseEdge = generateConnectionAndEdge({base: Course, target: Course}).edge;

        [School, Eval, Occurrence, Course, Eval, FilterForm, CourseConnection, CourseEdge, PageInfo].forEach(
            (type) => props.apiEndpoint.addType(type),
        );

        props.apiEndpoint.addQuery('getCourses', new ResolvableField({
            returnType: list_of(Course),
            dataSource: dataSource,
            args: {
                id: required_string,
            },
            requestMappingTemplate: MappingTemplate.dynamoDbGetItem('id', 'id'),
            responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
        }));
        props.apiEndpoint.addQuery('filterCourses', new ResolvableField({
            returnType: CourseConnection.attribute(),
            dataSource: dataSource,
            args: {
                form: required(FilterForm),
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