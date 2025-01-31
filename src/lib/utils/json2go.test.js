const jsonToGo = require('./json2go');

describe('jsonToGo', () => {
  /**
   * Test if jsonToGo correctly handles an array of objects
   * This test covers the scenario where the input JSON is an array of objects,
   * which should result in a slice of structs in Go
   */
  test('handles array of objects correctly', () => {
    const input = JSON.stringify([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 }
    ]);
    const expected = `type Root []struct {
	Name string \`json:"name"\`
	Age int \`json:"age"\`
}`;

    const result = jsonToGo(input, 'Root');

    // Remove whitespace and newlines for easier comparison
    const cleanResult = result.go.replace(/\s+/g, '');
    const cleanExpected = expected.replace(/\s+/g, '');

    expect(cleanResult).toBe(cleanExpected);
  });
});