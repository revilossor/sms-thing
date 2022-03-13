import { SQSEvent } from 'aws-lambda'

export async function handler (event: SQSEvent): Promise<void> {
  // TODO this should take an sqs batch
  // and send sms via sns
  // TODO this should also respond with batchItemFailures

  console.log(JSON.stringify(event, null, 2))
}
