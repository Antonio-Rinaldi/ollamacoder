export class ChatStream<T> {
  static fromReadableStream<T>(readableStream: ReadableStream<T>) {
    return new ChatEventSource<>(readableStream);
  }
}

class ChatEventSource<T> {
  private readonly readableStream: ReadableStream<T>;
  private readonly events: {
    content: (delta: string, content: string) => void;
    finalContent: (content: string) => void;
  };

  constructor(readableStream: ReadableStream<T>) {
    this.readableStream = readableStream;
    this.events = {
      content: () => {},
      finalContent: () => {},
    };
  }

  on(event: 'content' | 'finalContent', handler: any) {
    this.events[event] = handler;
    return this;
  }

  async read() {
    return this.startReading();
  }

  private async startReading() {
    let fullContent = '';
    try {
      const reader = this.readableStream.getReader();
      const errors = [];
      while (true) {
        const {done, value} = await reader.read();
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
            const delta = data.message.content;
            fullContent += delta;
            this.events.content(delta, fullContent);
          } catch (error) {
            errors.push(error);
          }
        }
      }
      if (errors.length > 0) {
        throw new Error('Error parsing stream data:\n' + errors.join('\n'));
      }
    } catch (error) {
      this.events.finalContent(fullContent); // Ensure we still get the content we have
      throw error;
    }
  }
}