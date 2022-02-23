import { App } from 'aws-cdk-lib';
import { AdminLayer, BusinessLayer, PersistenceLayer, PresentationLayer } from './layers';

export abstract class AbstractServerlessApp extends App {
  abstract presentationLayer: PresentationLayer;
  abstract businessLayer: BusinessLayer;
  abstract persistenceLayer: PersistenceLayer;
  abstract adminLayer: AdminLayer;
}
