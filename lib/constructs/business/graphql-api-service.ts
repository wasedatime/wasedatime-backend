import * as cdk from "@aws-cdk/core";
import {AbstractGraphqlEndpoint} from "./api-endpoint";
import {
    Directive,
    EnumType,
    GraphqlApi,
    MappingTemplate,
    ObjectType,
    ResolvableField,
    Resolver
} from "@aws-cdk/aws-appsync";
import {IUserPool} from "@aws-cdk/aws-cognito";
import {ITable} from "@aws-cdk/aws-dynamodb";
import {from_type, int, list_int, list_of, string} from "../../utils/appsync";

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

export abstract class SyllabusApiService extends cdk.Construct {

    abstract readonly resolvers: { [name: string]: Resolver } = {};

    protected constructor(scope: AbstractGraphqlEndpoint, id: string, props: GraphqlApiServiceProps) {
        super(scope, id);

        const dataSource = props.apiEndpoint.addDynamoDbDataSource('dynamo-db', props.dataSource, {
            description: "Syllabus table from DynamoDB.",
            name: "syllabus-table"
        });

        const schoolType = new EnumType('School', {
            definition: [
                "PSE",
                "FSE",
                "SSS",
                "SILS"
            ]
        });
        const evalType = new ObjectType("Evaluation", {
            definition: {
                "type": int,
                "percent": int,
                "criteria": string
            }
        });
        const occurrenceType = new ObjectType("Occurrence", {
            definition: {
                "day": int,
                "period": int,
                "location": string
            }
        });
        const courseType = new ObjectType("Course", {
            definition: {
                "id": string,
                "category": string,
                "code": string,
                "credit": int,
                "evals": list_of(evalType),
                "instructor": string,
                "lang": list_int,
                "level": int,
                "minYear": int,
                "occurrences": list_of(occurrenceType),
                "school": from_type(schoolType),
                "subtitle": string,
                "term": string,
                "title": string,
                "title_jp": string,
                "type": int
            },
            directives: [Directive.apiKey()]
        });

        [schoolType, evalType, occurrenceType, courseType].forEach((value) => props.apiEndpoint.addType(value));
        props.apiEndpoint.addQuery('getCourse', new ResolvableField({
            returnType: courseType.attribute(),
            dataSource: dataSource,
            requestMappingTemplate: MappingTemplate.dynamoDbGetItem('id', 'id'),
            responseMappingTemplate: MappingTemplate.dynamoDbResultItem()
        }));
    }
}

export abstract class CareerApiService extends cdk.Construct {

    abstract readonly resolvers: { [name: string]: Resolver } = {};

    protected constructor(scope: AbstractGraphqlEndpoint, id: string, props: GraphqlApiServiceProps) {
        super(scope, id);
    }
}