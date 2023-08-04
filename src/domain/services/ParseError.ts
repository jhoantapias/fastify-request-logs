import * as path from 'path';

export function parseError(err: Error): Record<string, string> | Error {
  if (err.stack) {
    const errorStack = err.stack?.split('\n').slice(1);
    if (!errorStack) {
      return { [err.name]: err.message };
    }
    const stack = {}
    errorStack.map((line) => {
      const [func, filePathLineCol] = line.split('at ');
      const [filePath, lineCol] = filePathLineCol.split(':');
      const functionName = func.trim() || '(anonymous)';
      const fileName = path.basename(filePath);
      const lineNumber = lineCol.split(':')[0];
      const functionWithFileName = `${fileName}.${functionName}`;
      const filePathWithLineNumber = `${filePath}:${lineNumber}`;

      return { [functionWithFileName]: filePathWithLineNumber };
    });
    return stack
  }
  return err;
}