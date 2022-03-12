#!/usr/bin/env node
/* eslint-disable no-new */
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { MessageInputStack } from '../lib/message-input-stack-stack'

const app = new cdk.App()

new MessageInputStack(app, 'MessageInputStack', {})
