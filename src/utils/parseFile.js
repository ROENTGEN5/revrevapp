import Papa from 'papaparse';

/**
 * Normalize a parsed row (from CSV or JSON) into a standard question object.
 * Supports three question types: multiple_choice, identification, enumeration.
 */
function normalizeQuestion(row, index) {
  const q = {};

  // Map common key variations to standard keys
  for (const [key, value] of Object.entries(row)) {
    const k = key.trim().toLowerCase().replace(/[\s_-]+/g, '');
    if (['type', 'questiontype', 'qtype'].includes(k)) q.type = value?.toString().trim().toLowerCase();
    else if (['question', 'q'].includes(k)) q.question = value?.toString().trim();
    else if (['optiona', 'a', 'choicea', 'option1'].includes(k)) q.optionA = value?.toString().trim();
    else if (['optionb', 'b', 'choiceb', 'option2'].includes(k)) q.optionB = value?.toString().trim();
    else if (['optionc', 'c', 'choicec', 'option3'].includes(k)) q.optionC = value?.toString().trim();
    else if (['optiond', 'd', 'choiced', 'option4'].includes(k)) q.optionD = value?.toString().trim();
    else if (['correctanswer', 'answer', 'correct', 'key'].includes(k)) q.correctAnswer = value?.toString().trim();
  }

  // Validate question text (required for all types)
  if (!q.question) throw new Error(`Row ${index + 1}: Missing "question" field.`);
  if (!q.correctAnswer) throw new Error(`Row ${index + 1}: Missing "correctAnswer" field.`);

  // Determine type (default to multiple_choice if options present and no type specified)
  let type = q.type || '';
  if (['mc', 'multiplechoice', 'multiple_choice', 'choice'].includes(type.replace(/[\s_-]+/g, ''))) {
    type = 'multiple_choice';
  } else if (['id', 'identification', 'identify'].includes(type.replace(/[\s_-]+/g, ''))) {
    type = 'identification';
  } else if (['enum', 'enumeration', 'enumerate', 'list'].includes(type.replace(/[\s_-]+/g, ''))) {
    type = 'enumeration';
  } else if (['tf', 'truefalse', 'true_false', 'trueorfalse'].includes(type.replace(/[\s_-]+/g, ''))) {
    type = 'true_false';
  } else if (!type && (q.optionA || q.optionB)) {
    // Auto-detect: if options are provided, treat as multiple choice
    type = 'multiple_choice';
  } else if (!type) {
    // No type and no options → treat as identification by default
    type = 'identification';
  }

  // === MULTIPLE CHOICE ===
  if (type === 'multiple_choice') {
    if (!q.optionA || !q.optionB) {
      throw new Error(`Row ${index + 1}: Multiple choice requires at least options A and B.`);
    }
    const answer = q.correctAnswer.toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(answer)) {
      throw new Error(`Row ${index + 1}: correctAnswer must be A, B, C, or D for multiple choice. Got "${q.correctAnswer}".`);
    }

    const options = [
      { label: 'A', text: q.optionA },
      { label: 'B', text: q.optionB },
      q.optionC ? { label: 'C', text: q.optionC } : null,
      q.optionD ? { label: 'D', text: q.optionD } : null,
    ].filter(Boolean);

    return {
      id: index,
      type: 'multiple_choice',
      question: q.question,
      options,
      correctAnswer: answer,
    };
  }

  // === IDENTIFICATION ===
  if (type === 'identification') {
    return {
      id: index,
      type: 'identification',
      question: q.question,
      correctAnswer: q.correctAnswer, // Preserve original casing for display
    };
  }

  // === ENUMERATION ===
  if (type === 'enumeration') {
    // Correct answers are pipe-separated: "Item1|Item2|Item3"
    const items = q.correctAnswer
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);

    if (items.length < 2) {
      throw new Error(`Row ${index + 1}: Enumeration requires at least 2 items separated by "|". Got "${q.correctAnswer}".`);
    }

    return {
      id: index,
      type: 'enumeration',
      question: q.question,
      correctAnswer: items, // Array of strings
      itemCount: items.length,
    };
  }

  // === TRUE OR FALSE ===
  if (type === 'true_false') {
    const normalized = q.correctAnswer.charAt(0).toUpperCase() + q.correctAnswer.slice(1).toLowerCase();
    if (normalized !== 'True' && normalized !== 'False') {
      throw new Error(`Row ${index + 1}: correctAnswer must be "True" or "False" for true/false questions. Got "${q.correctAnswer}".`);
    }
    return {
      id: index,
      type: 'true_false',
      question: q.question,
      correctAnswer: normalized,
    };
  }

  throw new Error(`Row ${index + 1}: Unknown question type "${type}". Use "multiple_choice", "identification", "enumeration", or "true_false".`);
}

/**
 * Parse a CSV file using PapaParse and return normalized question objects.
 */
function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        try {
          if (results.errors.length > 0) {
            const firstError = results.errors[0];
            throw new Error(`CSV parse error at row ${firstError.row}: ${firstError.message}`);
          }
          if (results.data.length === 0) {
            throw new Error('The CSV file appears to be empty or has no valid rows.');
          }
          const questions = results.data.map((row, i) => normalizeQuestion(row, i));
          resolve(questions);
        } catch (err) {
          reject(err);
        }
      },
      error(err) {
        reject(new Error(`Failed to read CSV file: ${err.message}`));
      },
    });
  });
}

/**
 * Parse a JSON file and return normalized question objects.
 */
function parseJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) {
          throw new Error('JSON file must contain an array of question objects.');
        }
        if (data.length === 0) {
          throw new Error('The JSON file contains an empty array.');
        }
        const questions = data.map((row, i) => normalizeQuestion(row, i));
        resolve(questions);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the file.'));
    reader.readAsText(file);
  });
}

/**
 * Main entry: detect file type and parse accordingly.
 */
export async function parseFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) {
    return parseCSV(file);
  } else if (name.endsWith('.json')) {
    return parseJSON(file);
  } else {
    throw new Error('Unsupported file type. Please upload a .csv or .json file.');
  }
}
