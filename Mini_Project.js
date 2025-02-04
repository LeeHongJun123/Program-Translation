const fs = require("fs");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Token Types
const TOKEN_TYPES = {
  KEYWORD: "KEYWORD", // create, delete, exit
  FILENAME: "FILENAME", // report.txt, data.json
  TO: "TO", // to (used in rename and copy)
};

// Lexical Analysis: Tokenize the input
function tokenize(input) {
  const tokens = [];
  const regex = /\b(\w+\.\w+|\w+)\b/g; // Matches words or filenames with dots
  let match;

  while ((match = regex.exec(input)) !== null) {
    const value = match[0];
    let type;

    if (value === "create" || value === "delete" || value === "exit" || value === "rename" || value === "copy") {
      type = TOKEN_TYPES.KEYWORD;
    } else if (value === "to") {
      type = TOKEN_TYPES.TO;
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
    if (
      tokens.length === 3 &&
      tokens[1].value === "file" &&
      tokens[2].type === TOKEN_TYPES.FILENAME
    ) {
      return true; // Valid create/delete file command
    }
  }

  if (firstToken.value === "rename") {
    if (
      tokens.length === 5 &&
      tokens[1].value === "file" &&
      tokens[2].type === TOKEN_TYPES.FILENAME &&
      tokens[3].value === "to" &&
      tokens[4].type === TOKEN_TYPES.FILENAME
    ) {
      return true; // Valid rename file command
    }
  }

  if (firstToken.value === "copy") {
    if (
      tokens.length === 5 &&
      tokens[1].value === "file" &&
      tokens[2].type === TOKEN_TYPES.FILENAME &&
      tokens[3].value === "to" &&
      tokens[4].type === TOKEN_TYPES.FILENAME
    ) {
      return true; // Valid copy file command
    }
  }

  return false; // Invalid command
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

function renameFile(oldname, newname) {
  fs.rename(oldname, newname, (err) => {
    if (err) {
      console.error(`Error renaming file: ${err.message}`);
    } else {
      console.log(`File renamed from ${oldname} to ${newname}`);
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

// Main Function: Run the interpreter
function runInterpreter() {
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

        // Execute the command
        const command = tokens[0].value;
        const filename = tokens[2].value;

        if (command === "create") {
          createFile(filename);
        } else if (command === "delete") {
          deleteFile(filename);
        } else if (command === "rename") {
          renameFile(filename, tokens[4].value);
        } else if (command === "copy") {
          copyFile(filename, tokens[4].value);
        }
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
  console.log("- rename file <oldname> to <newname>");
  console.log("- copy file <source> to <destination>");
  console.log("- list files");
  console.log("- exit (to end the session)");
  prompt();
}

// Start the interpreter
runInterpreter();