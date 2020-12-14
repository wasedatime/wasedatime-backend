#!/usr/bin/env node
import 'source-map-support/register';
import {WasedaTime} from '../lib/app';


const wasedaTime = new WasedaTime();

wasedaTime.synth();