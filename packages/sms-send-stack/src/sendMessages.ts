import { SMSRequest } from './getMessages'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'

const client = new SNSClient({ region: process.env.AWS_REGION })

async function sendMessage (request: SMSRequest): Promise<void> {
  const command = new PublishCommand({
    Message: request.message,
    PhoneNumber: request.phoneNumber.replace(/^[0]/, '+44')
  })
  await client.send(command)
}

// TODO unit test me
export async function sendMessages (requests: SMSRequest[]): Promise<SMSRequest[]> {
  const result = await Promise.allSettled(
    requests.map(sendMessage)
  )

  return requests.filter((_, index) => result[index].status === 'rejected')
}
