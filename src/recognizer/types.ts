export interface ImageRecognizer {
  Recognize: Recognize

  [propName: string]: any;
}

export interface Recognize {
  (correlationId: string, image: Buffer): Promise<Array<string>>
}