using System.Diagnostics;
using Ecomm.Application.Exceptions;
using Ecomm.Domain.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Ecomm.API.Middleware;

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var method = httpContext.Request.Method;
        var path = httpContext.Request.Path;

        var (statusCode, title) = exception switch
        {
            // 409 Conflict: Business state or uniqueness conflicts
            InsufficientStockException => (StatusCodes.Status409Conflict, "Insufficient Stock"),
            InvalidStatusTransitionException => (StatusCodes.Status409Conflict, "Invalid Status Transition"),
            EmailAlreadyExistException => (StatusCodes.Status409Conflict, "Email Already Exists"),

            // 401 Unauthorized: All authentication & refresh token failures
            InvalidCredentialsException => (StatusCodes.Status401Unauthorized, "Invalid Credentials"),
            ExpiredRefreshTokenException => (StatusCodes.Status401Unauthorized, "Refresh Token Expired"),
            InValidRefreshToken => (StatusCodes.Status401Unauthorized, "Invalid Refresh Token"),
            NoUserRefreshTokenExist => (StatusCodes.Status401Unauthorized, "Invalid Refresh Token"),

            // 404 Not Found: Missing domain resources
            UserNotFoundException => (StatusCodes.Status404NotFound, "User Not Found"),
            ProductNotFoundException => (StatusCodes.Status404NotFound, "Product Not Found"),

            // 400 Bad Request: Domain validation rules (keep below specific subclasses if any inherit from DomainException)
            IncorrectPasswordException => (StatusCodes.Status400BadRequest, "Incorrect Password"),
            DomainException => (StatusCodes.Status400BadRequest, "Domain Validation Error"),

            // 500 Internal Server Error: Unhandled exceptions
            _ => (StatusCodes.Status500InternalServerError, "Internal Server Error")
        };

        if (statusCode == StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Unhandled exception | {Method} {Path}",method, path);
        }
        else
        {
            logger.LogWarning("Handled domain exception  | {Method} {Path} | {ExceptionMessage}", method, path, exception.Message);
        }

        var detail = statusCode == StatusCodes.Status500InternalServerError
            ? "An unexpected error occurred. Please try again later."
            : exception.Message;

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail
        };

        httpContext.Response.StatusCode = statusCode;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}
