import { SQSEvent, SQSRecord } from 'aws-lambda'

export interface SMSRequest {
  messageId: string
  message: string | null
  phoneNumber: string | null
}

function transformToSMSRequest (record: SQSRecord): SMSRequest {
  const { Message, MessageId: messageId } = JSON.parse(record.body)

  if (typeof (messageId) === 'undefined') {
    throw new Error('expected event record to contain a MessageId property')
  }

  const { message = null, phoneNumber = null } = JSON.parse(Message)
  return {
    messageId,
    message,
    phoneNumber: phoneNumber
  }
}

export function getMessagesToSend (event: SQSEvent): SMSRequest[] {
  return event.Records.map(transformToSMSRequest)
}
