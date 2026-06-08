import axios from 'axios';

const API_BASE = 'https://api.acesatai.com';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch the next adaptive question based on user's theta score
 */
export async function getNextQuestion(
  userId: string,
  section: string,
  excludedIds: string = '0'
) {
  const response = await client.get('/api/v1/next-question', {
    params: {
      user_id: userId,
      section,
      excluded_ids: excludedIds || '0',
    },
  });
  return response.data;
}

/**
 * Submit an answer and receive IRT-adjusted feedback
 */
export async function submitAnswer(
  userId: string,
  questionId: number,
  selectedAnswer: string,
  section: string
) {
  const response = await client.post('/api/v1/submit-answer', {
    user_id: userId,
    question_id: questionId,
    selected_answer: selectedAnswer,
    section,
  });
  return response.data;
}

/**
 * Snap & Solve: Upload an image of a SAT problem for GPT-4o Vision analysis
 */
export async function snapSolve(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await client.post('/api/v1/snap-solve', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  });
  return response.data;
}

/**
 * Get user profile with theta scores, XP, and streak
 */
export async function getUserProfile(userId: string) {
  const response = await client.get(`/api/v1/user/${userId}`);
  return response.data;
}

/**
 * Register or create a new user profile
 */
export async function createUserProfile(
  userId: string,
  email: string,
  preferredLanguage: string = 'English'
) {
  const response = await client.post('/api/v1/user/register', {
    user_id: userId,
    email,
    preferred_language: preferredLanguage,
  });
  return response.data;
}

/**
 * Voice coach: Send audio for Socratic tutoring response
 */
export async function voiceCoach(
  userId: string,
  section: string,
  audioFile: File | Blob
) {
  const formData = new FormData();
  formData.append('user_id', userId);
  formData.append('section', section);
  formData.append('file', audioFile, 'recording.webm');

  const response = await client.post('/api/v1/voice-coach', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'blob',
    timeout: 60000,
  });
  return response.data;
}

export default client;
