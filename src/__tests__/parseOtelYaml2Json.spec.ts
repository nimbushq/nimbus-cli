import { processDirectory } from '../parseOtelYaml2Json'; // Adjust the import path as needed
import path from 'path';
import fs from 'fs';

// Define paths for sample test files and directories
const testBaseDir = path.join(__dirname, 'testYamls');  // Adjust as necessary
const sampleYamlContent1 = `
type: 'Config'
fields:
- name: retry_on_failure
  kind: bool
  default: true
`;

const sampleYamlContent2 = `
type: 'AnotherConfig'
fields:
- name: endpoint
  kind: string
  default: ""
`;

describe('processDirectory', () => {
  beforeAll(() => {
    // Create the test directory and files before the tests run
    fs.mkdirSync(path.join(testBaseDir, 'dir1'), { recursive: true });
    fs.mkdirSync(path.join(testBaseDir, 'dir2'), { recursive: true });
    fs.writeFileSync(path.join(testBaseDir, 'dir1', 'file1.yaml'), sampleYamlContent1, 'utf8');
    fs.writeFileSync(path.join(testBaseDir, 'dir2', 'file2.yaml'), sampleYamlContent2, 'utf8');
    fs.writeFileSync(path.join(testBaseDir, 'dir2', 'file3.yaml'), sampleYamlContent1, 'utf8');
  });

  afterAll(() => {
    // Clean up the test directory and files after the tests run
    fs.rmSync(testBaseDir, { recursive: true, force: true });
  });

  it('should correctly process directories and convert yaml to schema', () => {
    const result = processDirectory(testBaseDir);

    // Add your assertions based on expected result
    expect(result).toHaveProperty('dir1');
    expect(result.dir1).toHaveProperty('file1');
    expect(result).toHaveProperty('dir2');
    expect(result.dir2).toHaveProperty('file2');
    expect(result.dir2).toHaveProperty('file3');
    expect(result).toMatchSnapshot()
    
    // You can add more detailed assertions based on the expected JSON schema structure
  });
});
