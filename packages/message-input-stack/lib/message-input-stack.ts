/* eslint-disable no-useless-escape */
import { Stack, StackProps, Aws, CfnOutput } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { Role, ServicePrincipal, PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { RestApi, AwsIntegration, PassthroughBehavior, RequestValidator, Model, JsonSchemaType } from 'aws-cdk-lib/aws-apigateway'

export class MessageInputStack extends Stack {
  private static readonly APIG_SERVICE_PRINCIPAL = 'apigateway.amazonaws.com'

  constructor (scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // TODO maybe api key / rate limit?

    const topic = new Topic(this, 'SendMessageTopic', {
      fifo: true,
      contentBasedDeduplication: true,
      topicName: 'send-message-topic'
    })

    const gatewayExecutionRole: any = new Role(this, 'GatewayExecutionRole', {
      assumedBy: new ServicePrincipal(MessageInputStack.APIG_SERVICE_PRINCIPAL),
      inlinePolicies: {
        PublishMessagePolicy: new PolicyDocument({
          statements: [new PolicyStatement({
            actions: ['sns:Publish'],
            resources: [topic.topicArn]
          })]
        })
      }
    })

    const api = new RestApi(this, 'MessagingApi')

    const sendMessageModel: Model = api.addModel('SendMessageModel', {
      schema: {
        type: JsonSchemaType.OBJECT,
        properties: {
          message: {
            type: JsonSchemaType.STRING // TODO min/max message length?
          },
          phoneNumber: {
            type: JsonSchemaType.STRING,
            minLength: 11,
            maxLength: 11
          }
        },
        required: ['message', 'phoneNumber'],
        additionalProperties: false
      }
    })

    api.root.addMethod('POST',
      new AwsIntegration({
        service: 'sns',
        integrationHttpMethod: 'POST',
        path: `${Aws.ACCOUNT_ID}/${topic.topicName}`,
        options: {
          credentialsRole: gatewayExecutionRole,
          passthroughBehavior: PassthroughBehavior.NEVER,
          requestParameters: {
            'integration.request.header.Content-Type': '\'application/json\''
          },
          requestTemplates: {
            'application/json': `Action=Publish&TopicArn=$util.urlEncode('${topic.topicArn}')&Message=$util.urlEncode($input.body)`
          },
          integrationResponses: [
            {
              statusCode: '200',
              responseTemplates: {
                'application/json': '{"status": "message received"}'
              }
            },
            {
              statusCode: '400',
              selectionPattern: '^\[Error\].*',
              responseTemplates: {
                'application/json': '{\"state\":\"error\",\"message\":\"$util.escapeJavaScript($input.path(\'$.errorMessage\'))\"}'
              }
            }
          ]
        }
      }),
      {
        methodResponses: [
          { statusCode: '200' },
          { statusCode: '400' }
        ],
        requestValidator: new RequestValidator(
          this,
          'RequestValidator',
          {
            restApi: api,
            requestValidatorName: 'sendMessageBodyValidator',
            validateRequestBody: true,
            validateRequestParameters: false
          }
        ),
        requestModels: {
          'application/json': sendMessageModel
        }
      }
    )

    // eslint-disable-next-line no-new
    new CfnOutput(this, 'SendMessageTopicARN', { value: topic.topicArn })
  }
}
