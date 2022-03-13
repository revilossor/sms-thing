import { SQSEvent } from 'aws-lambda'
import { getMessages } from './getMessages'

export async function handler (event: SQSEvent): Promise<void> {
  const [sendable, unsendable] = getMessages(event)
  console.dir({ sendable, unsendable })

  // TODO SMSService
  // - iterates over toSend, makes each promise, returns error ones from allSettled
}
