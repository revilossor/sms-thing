/* eslint-disable no-useless-escape */
import { Stack, StackProps, Aws } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { Role, ServicePrincipal, PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { RestApi, AwsIntegration, PassthroughBehavior } from 'aws-cdk-lib/aws-apigateway'

export class MessageInputStack extends Stack {
  private static readonly APIG_SERVICE_PRINCIPAL = 'apigateway.amazonaws.com'

  constructor (scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // TODO make FIFO
    const topic = new Topic(this, 'SendMessageTopic')

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

    // TODO validation?
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
        ]
      }
    )
  }
}
