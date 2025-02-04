const fs = require("fs");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Token Types
const TOKEN_TYPES = {
  KEYWORD: "KEYWORD", // create, delete, exit
  FILENAME: "FILENAME", // report.txt, data.json
  TO: "TO", // The 'to' keyword in commands
  EOF: "EOF", // End of input
};

// DFA State Transition Table for Lexical Analysis
const DFA_STATES = {
  START: "START",
  KEYWORD: "KEYWORD",
  FILENAME: "FILENAME",
  TO: "TO",
  ERROR: "ERROR",
};

const DFA_TRANSITIONS = {
  [DFA_STATES.START]: {
    create: DFA_STATES.KEYWORD,
    delete: DFA_STATES.KEYWORD,
    exit: DFA_STATES.KEYWORD,
    copy: DFA_STATES.KEYWORD, 
    rename: DFA_STATES.KEYWORD, 
    default: DFA_STATES.FILENAME,
  },
  [DFA_STATES.KEYWORD]: {
    file: DFA_STATES.START,
  },
  [DFA_STATES.FILENAME]: {
    to: DFA_STATES.TO, // 'to' after a filename in copy/rename
  },
  [DFA_STATES.TO]: {
    file: DFA_STATES.FILENAME, // Second filename after 'to'
  }, // Accept state for filenames
};

// Lexical Analysis: Tokenize input using DFA
function tokenize(input) {
  const tokens = [];
  const words = input.split(/\s+/); // Split input into words
  let state = DFA_STATES.START;

  for (const word of words) {
    let type;
    if (state === DFA_STATES.START) {
      if (DFA_TRANSITIONS[state][word]) {
        state = DFA_TRANSITIONS[state][word];
        type = TOKEN_TYPES.KEYWORD;
      } else {
        state = DFA_TRANSITIONS[state].default;
        type = TOKEN_TYPES.FILENAME;
      }
    } else if (state === DFA_STATES.KEYWORD) {
      if (word === "file") {
        state = DFA_STATES.START;
        type = TOKEN_TYPES.KEYWORD;
      } else {
        state = DFA_STATES.ERROR;
      }
    } else if (state === DFA_STATES.FILENAME) {
      type = TOKEN_TYPES.FILENAME;  // Ensure filename tokens are set
    } else if (state === DFA_STATES.TO) {
      if (word === "to") {
        state = DFA_STATES.TO;
        type = TOKEN_TYPES.TO;
      } else {
        state = DFA_STATES.ERROR;
      }
    }

    if (state === DFA_STATES.ERROR) {
      throw new Error(`Invalid token: ${word}`);
    }

    tokens.push({ type, value: word });
  }

  tokens.push({ type: TOKEN_TYPES.EOF, value: "" }); // End of input
  return tokens;
}

// Formal Grammar in BNF Notation
/*
Command -> "create" "file" Filename | "delete" "file" Filename | "exit"
Filename -> Word ("." Word)?
Word -> [a-zA-Z]+
*/

// Parsing Table for LL(1) Parser
const PARSING_TABLE = {
  Command: {
    create: ["create", "file", "Filename"],
    delete: ["delete", "file", "Filename"],
    copy: ["copy", "file", "Filename", "to", "Filename"],
    rename: ["rename", "file", "Filename", "to", "Filename"],
    exit: ["exit"],
  },
  Filename: {
    [TOKEN_TYPES.FILENAME]: ["Word"],
  },
  Word: {
    [TOKEN_TYPES.FILENAME]: ["FILENAME"],
  },
};

// Syntax Analysis: LL(1) Parser
function parseCommand(tokens) {
  const stack = ["Command"]; // Start with the non-terminal "Command"
  let index = 0;

  while (stack.length > 0) {
    const top = stack.pop();
    const currentToken = tokens[index];

    if (top in PARSING_TABLE) {
      // Non-terminal
      const production = PARSING_TABLE[top][currentToken.value] || PARSING_TABLE[top][currentToken.type];
      if (!production) {
        throw new Error(`Syntax error: Unexpected token ${currentToken.value}`);
      }
      stack.push(...production.reverse()); // Push production rules in reverse order
    } else {
      // Terminal
      if (top === currentToken.value || top === currentToken.type) {
        index++; // Move to the next token
      } else {
        throw new Error(`Syntax error: Expected ${top}, found ${currentToken.value}`);
      }
    }
  }

  return true; // Input is valid
}

// File System Operations
function createFile(filename) {
  fs.writeFile(filename, "", (err) => {
    if (err) {
      console.error(`Error creating file: ${err.message}`);
    } else {
      console.log(`File created: ${filename}`);
    }
  });
}

function deleteFile(filename) {
  fs.unlink(filename, (err) => {
    if (err) {
      console.error(`Error deleting file: ${err.message}`);
    } else {
      console.log(`File deleted: ${filename}`);
    }
  });
}

function copyFile(source, destination) {
  fs.copyFile(source, destination, (err) => {
    if (err) {
      console.error(`Error copying file: ${err.message}`);
    } else {
      console.log(`File copied from ${source} to ${destination}`);
    }
  });
}

function renameFile(oldName, newName) {
  fs.rename(oldName, newName, (err) => {
    if (err) {
      console.error(`Error renaming file: ${err.message}`);
    } else {
      console.log(`File renamed from ${oldName} to ${newName}`);
    }
  });
}


// Main Function: Run the interpreter
function runInterpreter() {
  console.log("Custom Command Language Interpreter");
  console.log("Supported commands:");
  console.log("- create file <filename>");
  console.log("- delete file <filename>");
  console.log("- copy file <source> to <destination>");
  console.log("- rename file <oldname> to <newname>");
  console.log("- exit (to end the session)");

  function prompt() {
    readline.question("Enter a command: ", (input) => {
      if (input.trim().toLowerCase() === "exit") {
        console.log("Session ended. Goodbye!");
        readline.close();
        return;
      }

      try {
        // Lexical Analysis
        const tokens = tokenize(input);
        console.log("Tokens:", tokens);

        // Syntax Analysis
        const isValid = parseCommand(tokens);
        console.log("Syntax Analysis: Valid command");

        // Execute the command
        const command = tokens[0].value;
        const filename = tokens[2]?.value;
        const filename2 = tokens[4]?.value;

        if (command === "create") {
          createFile(filename);
        } else if (command === "delete") {
          deleteFile(filename);
        } else if (command === "copy") {
          copyFile(filename, filename2);
        } else if (command === "rename") {
          renameFile(filename, filename2);
        }
      } catch (error) {
        console.log("Error:", error.message);
      }

      // Continue prompting
      prompt();
    });
  }

  prompt();
}

// Start the interpreter
runInterpreter();