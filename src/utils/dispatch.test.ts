import { removeTimestamp } from './dispatch'

describe('removeTimestamp', () => {
  it('removes "   0:00.00"', () =>
    expect(removeTimestamp('   0:00.00 This is a test')).toMatch(
      'This is a test'
    ))

  it('removes "   5:05.05"', () =>
    expect(removeTimestamp('   5:05.05 This is a test')).toMatch(
      'This is a test'
    ))

  it('removes "  10:10.10"', () =>
    expect(removeTimestamp('  10:10.10 This is a test')).toMatch(
      'This is a test'
    ))

  it('removes "  50:50.50"', () =>
    expect(removeTimestamp('  50:50.50 This is a test')).toMatch(
      'This is a test'
    ))
})
