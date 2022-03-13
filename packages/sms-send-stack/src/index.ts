import { SQSEvent } from 'aws-lambda'
import { getMessagesToSend } from './getMessagesToSend'

export async function handler (event: SQSEvent): Promise<void> {
  const toSend = getMessagesToSend(event)
  console.dir({ toSend })
}
