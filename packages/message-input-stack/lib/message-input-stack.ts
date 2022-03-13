/* eslint-disable no-useless-escape */
import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { RestApi, AwsIntegration, PassthroughBehavior, RequestValidator, Model, JsonSchemaType } from 'aws-cdk-lib/aws-apigateway'

export class MessageInputStack extends Stack {
  private static readonly APIG_SERVICE_PRINCIPAL = 'apigateway.amazonaws.com'

  constructor (scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const topic = new Topic(this, 'SendMessageTopic', {
      fifo: true,
      contentBasedDeduplication: true,
      topicName: 'send-message-topic'
    })

    const gatewayExecutionRole: any = new Role(this, 'GatewayExecutionRole', {
      assumedBy: new ServicePrincipal(MessageInputStack.APIG_SERVICE_PRINCIPAL)
    })
    topic.grantPublish(gatewayExecutionRole)

    const api = new RestApi(this, 'MessagingApi')

    const sendMessageModel: Model = api.addModel('SendMessageModel', {
      schema: {
        type: JsonSchemaType.OBJECT,
        properties: {
          message: {
            type: JsonSchemaType.STRING,
            maxLength: 140
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
        path: '/',
        options: {
          credentialsRole: gatewayExecutionRole,
          passthroughBehavior: PassthroughBehavior.NEVER,
          requestParameters: {
            'integration.request.header.Content-Type': "'application/x-www-form-urlencoded'"
          },
          requestTemplates: {
            'application/json': `Action=Publish&TopicArn=$util.urlEncode('${topic.topicArn}')&Message=$util.urlEncode($input.body)&MessageGroupId=api`
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
