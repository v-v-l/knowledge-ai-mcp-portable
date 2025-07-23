/**
 * Simple Response Builder for portable MCP client
 */
class ResponseBuilder {
  success(data, message = 'Success') {
    return {
      success: true,
      message,
      data
    };
  }

  error(message, details = null) {
    return {
      success: false,
      message,
      details
    };
  }

  textResponse(text) {
    return {
      content: [
        {
          type: "text",
          text
        }
      ]
    };
  }
}

export default ResponseBuilder;