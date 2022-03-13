import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { MessageInputStack } from '../lib/message-input-stack'

describe('message input stack', () => {
  let template: Template

  beforeAll(() => {
    const app = new cdk.App()
    const stack = new MessageInputStack(app, 'TestMessageInputStack')
    template = Template.fromStack(stack)
  })

  it('describes a send message topic with the correct properties', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      ContentBasedDeduplication: true,
      FifoTopic: true,
      TopicName: 'send-message-topic.fifo'
    })
  })

  it('exports a "SendMessageTopicARN"', () => {
    template.hasOutput('SendMessageTopicARN', {})
  })

  it('matches the snapshot', () => {
    expect(template.toJSON()).toMatchSnapshot()
  })
})
