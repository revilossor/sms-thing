import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { MessageInputStack } from '../lib/message-input-stack'

it('Stack matches snapshot', () => {
  const app = new cdk.App()
  const stack = new MessageInputStack(app, 'TestMessageInputStack')
  const template = Template.fromStack(stack)
  expect(template.toJSON()).toMatchSnapshot()
})
