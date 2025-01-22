// Custom Command Language Interpreter

// Grammar Rules (BNF Notation):
// Command -> create file <filename> | delete file <filename> | exit
// <filename> -> word(.word)?

// Token Types
const TOKEN_TYPES = {
  KEYWORD: "KEYWORD", // create, delete, exit
  FILENAME: "FILENAME", // report.txt, data.json
};

// Lexical Analysis: Tokenize the input
function tokenize(input) {
  const tokens = [];
  const regex = /\b(\w+\.\w+|\w+)\b/g; // Matches words or filenames with dots
  let match;

  while ((match = regex.exec(input)) !== null) {
    const value = match[0];
    let type;

    if (value === "create" || value === "delete" || value === "exit") {
      type = TOKEN_TYPES.KEYWORD;
    } else {
      type = TOKEN_TYPES.FILENAME;
    }

    tokens.push({ type, value });
  }

  return tokens;
}

// Syntax Analysis: Validate the sequence of tokens
function parseCommand(tokens) {
  if (tokens.length === 0) {
    return false; // Empty input
  }

  const firstToken = tokens[0];

  if (firstToken.value === "exit") {
    return true; // Valid exit command
  }

  if (firstToken.value === "create" || firstToken.value === "delete") {
    if (tokens.length === 3 && tokens[1].value === "file" && tokens[2].type === TOKEN_TYPES.FILENAME) {
      return true; // Valid create/delete file command
    }
  }

  return false; // Invalid command
}

// Main Function: Run the interpreter
function runInterpreter() {
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function prompt() {
    readline.question("Enter a command: ", (input) => {
      if (input.trim().toLowerCase() === "exit") {
        console.log("Session ended. Goodbye!");
        readline.close();
        return;
      }

      // Lexical Analysis
      const tokens = tokenize(input);
      console.log("Tokens:", tokens);

      // Syntax Analysis
      const isValid = parseCommand(tokens);
      if (isValid) {
        console.log("Syntax Analysis: Valid command");
      } else {
        console.log("Syntax Analysis: Invalid command");
      }

      // Continue prompting
      prompt();
    });
  }

  console.log("Custom Command Language Interpreter");
  console.log("Supported commands:");
  console.log("- create file <filename>");
  console.log("- delete file <filename>");
  console.log("- exit (to end the session)");
  prompt();
}

// Start the interpreter
runInterpreter();