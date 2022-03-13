import { SQSEvent, SQSBatchResponse } from 'aws-lambda'

import { getMessages } from './getMessages'
import { sendMessages } from './sendMessages'
import { getFailedItems } from './getFailedItems'

export async function handler (event: SQSEvent): Promise<SQSBatchResponse> {
  const [sendable, unsendable] = getMessages(event)
  const unsent = await sendMessages(sendable)
  return getFailedItems(
    ...unsendable,
    ...unsent
  )
}
