export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!email.includes('@')) throw new Error('Email inválido')
    return new Email(email.toLowerCase().trim())
  }

  toString(): string {
    return this.value
  }
}
