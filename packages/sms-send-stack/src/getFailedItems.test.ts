import { getFailedItems } from './getFailedItems'
import { SMSRequest } from './getMessages'

it('should map passed SMSRequests to the appropriate structure', () => {
  const items = [
    { messageId: '1' },
    { messageId: '2' },
    { messageId: '3' }
  ] as SMSRequest[]

  expect(getFailedItems(...items)).toEqual({
    batchItemFailures: [
      { itemIdentifier: '1' },
      { itemIdentifier: '2' },
      { itemIdentifier: '3' }
    ]
  })
})

it('should return no failures if no SMSRequests are passed', () => {
  expect(getFailedItems()).toEqual({
    batchItemFailures: []
  })
})
