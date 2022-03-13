import { SQSEvent, SQSRecord } from 'aws-lambda'

export interface SMSRequest {
  messageId: string
  message: string
  phoneNumber: string
}

export type SMSRequestTuple = [SMSRequest[], SMSRequest[]]

export const SENDABLE = 0
export const UNSENDABLE = 1

export function getMessages (event: SQSEvent): SMSRequestTuple {
  return event.Records.reduce((output: SMSRequestTuple, record: SQSRecord) => {
    const { Message, MessageId: messageId } = JSON.parse(record.body)

    if (typeof (messageId) === 'undefined') {
      throw new Error('expected event record to contain a MessageId property')
    }

    const { message, phoneNumber } = JSON.parse(Message)

    const category = typeof (message) === 'undefined' || typeof (phoneNumber) === 'undefined'
      ? UNSENDABLE
      : SENDABLE

    output[category].push({ messageId, message, phoneNumber })

    return output
  }, [[], []])
}
