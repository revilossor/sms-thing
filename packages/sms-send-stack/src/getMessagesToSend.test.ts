import { SQSEvent, SQSRecord } from 'aws-lambda'
import { getMessagesToSend, SMSRequest } from './getMessagesToSend'

const getSQSEvent = (requests: Array<Partial<SMSRequest>>): SQSEvent => ({
  Records: requests.map(request => ({
    body: JSON.stringify({
      Message: JSON.stringify({
        message: request.message,
        phoneNumber: request.phoneNumber
      }),
      MessageId: request.messageId
    })
  })) as SQSRecord[]
})

it('should extract a set of { message, phoneNumber } and message id from an sqs event', () => {
  const requests = [
    { messageId: 'one', message: 'message one', phoneNumber: '11111111111' },
    { messageId: 'two', message: 'message two', phoneNumber: '22222222222' },
    { messageId: 'three', message: 'message three', phoneNumber: '33333333333' }
  ]

  const event = getSQSEvent(requests)

  expect(getMessagesToSend(event)).toEqual(requests)
})

it('should still return the messageId if other props are missing', () => {
  const event = getSQSEvent([
    { messageId: 'one', message: 'message one' },
    { messageId: 'two', phoneNumber: '44444444444' },
    { messageId: 'three' }
  ])

  expect(getMessagesToSend(event)).toEqual([
    {
      messageId: 'one',
      message: 'message one',
      phoneNumber: null
    },
    {
      messageId: 'two',
      message: null,
      phoneNumber: '44444444444'
    },
    {
      messageId: 'three',
      message: null,
      phoneNumber: null
    }
  ])
})

it('should throw if a messageId is missing', () => {
  const event = getSQSEvent([{}])

  expect(() => getMessagesToSend(event)).toThrow(
    'expected event record to contain a MessageId property'
  )
})
