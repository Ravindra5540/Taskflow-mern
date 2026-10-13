export function errorHandler(error, _request, response, _next) {
  console.error('Unhandled request error:', error.message);
  response.status(500).json({ message: 'Something went wrong. Please try again.' });
}
