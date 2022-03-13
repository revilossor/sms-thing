import { SQSBatchResponse } from 'aws-lambda'
import { SMSRequest } from './getMessages'

export function getFailedItems (...requests: SMSRequest[]): SQSBatchResponse {
  return {
    batchItemFailures: requests.map(({ messageId }) => ({
      itemIdentifier: messageId
    }))
  }
}
