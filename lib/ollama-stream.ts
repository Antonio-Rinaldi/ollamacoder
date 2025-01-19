export class OllamaStream {
  static fromReadableStream(stream: ReadableStream) {
    return new OllamaEventSource(stream);
  }
}

class OllamaEventSource {
  private reader: ReadableStreamDefaultReader;
  private readonly events: {
    content: (delta: string, content: string) => void;
    finalContent: (content: string) => void;
  };
  
  constructor(stream: ReadableStream) {
    this.reader = stream.getReader();
    this.events = {
      content: () => {},
      finalContent: () => {}
    };
  }

  on(event: 'content' | 'finalContent', handler: any) {
    this.events[event] = handler;
    if (event === 'content') this.startReading();
    return this;
  }

  private async startReading() {
    let fullContent = '';
    try {
      while (true) {
        const {done, value} = await this.reader.read();
        if (done) {
          this.events.finalContent(fullContent);
          break;
        }
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.done) {
              this.events.finalContent(fullContent);
              return;
            }
            const delta = data.response;
            fullContent += delta;
            this.events.content(delta, fullContent);
          } catch (error) {
            console.error('Error parsing stream data:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error reading stream:', error);
      this.events.finalContent(fullContent); // Ensure we still get the content we have
    }
  }
}