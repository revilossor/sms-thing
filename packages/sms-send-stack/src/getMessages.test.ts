import { SQSEvent, SQSRecord } from 'aws-lambda'
import { getMessages, SMSRequest } from './getMessages'

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

it('should extract sendable requests from an sqs event', () => {
  const requests = [
    { messageId: 'one', message: 'message one', phoneNumber: '11111111111' },
    { messageId: 'two', message: 'message two', phoneNumber: '22222222222' },
    { messageId: 'three', message: 'message three', phoneNumber: '33333333333' }
  ]

  const event = getSQSEvent(requests)

  expect(getMessages(event)).toEqual([requests, []])
})

it('set consider requests with missing properties unsendable', () => {
  const records = [
    { messageId: 'one', message: 'message one' },
    { messageId: 'two', phoneNumber: '44444444444' },
    { messageId: 'three' },
    { messageId: 'four', message: 'message four', phoneNumber: '55555555555' }
  ]

  const event = getSQSEvent(records)

  expect(getMessages(event)).toEqual([
    [
      records.at(3)
    ],
    [
      records.at(0),
      records.at(1),
      records.at(2)
    ]
  ])
})

it('should throw if a messageId is missing', () => {
  const event = getSQSEvent([{}])

  expect(() => getMessages(event)).toThrow(
    'expected event record to contain a MessageId property'
  )
})
