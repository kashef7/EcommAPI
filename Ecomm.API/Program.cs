using System.Security.Claims;
using System.Text;
using DotNetEnv;
using Ecomm.API.Middleware;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.Services.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Carts;
using Ecomm.Application.UseCases.Abstraction.Products;
using Ecomm.Application.UseCases.Abstraction.Users;
using Ecomm.Application.UseCases.Implementation.Carts;
using Ecomm.Application.UseCases.Implementation.Products;
using Ecomm.Application.UseCases.Implementation.Users;
using Ecomm.Infrastructure.Persistence;
using Ecomm.Infrastructure.Repositories.Implementation;
using Ecomm.Infrastructure.Services.Implementation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Serilog;
using Swashbuckle.AspNetCore.Filters;

Env.TraversePath().Load();

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .Enrich.WithThreadId());

    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException("Connection string 'DefaultConnection' was not found or is empty. Please configure 'ConnectionStrings:DefaultConnection' in appsettings or as the 'ConnectionStrings__DefaultConnection' environment variable.");
    }

    
    builder.Services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidAudience = builder.Configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!))
            };
            options.Events = new JwtBearerEvents
            {
                OnForbidden = context =>
                {
                    var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                    var userId = context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? context.HttpContext.User.FindFirst("sub")?.Value
                        ?? "anonymous";
                    logger.LogWarning("Forbidden | {Method} {Path} | User {UserId}",
                        context.HttpContext.Request.Method,
                        context.HttpContext.Request.Path,
                        userId);
                    return Task.CompletedTask;
                }
            };
        });

    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    });
    
    builder.Services.AddDbContext<AppDbContext>(o => o.UseNpgsql(connectionString));

    builder.Services.AddScoped<IUserRepo, UserRepo>();
    builder.Services.AddScoped<ISignUpUserUseCase, SignUpUserUseCase>();
    builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
    builder.Services.AddScoped<ITokenService, TokenService>();
    builder.Services.AddScoped<ILoginUserUseCase, LoginUserUseCase>();
    builder.Services.AddScoped<IPasswordVerifier, PasswordVerifier>();
    builder.Services.AddScoped<ILogoutUserUseCase, LogoutUserUseCase>();
    builder.Services.AddScoped<IRefreshUserTokenUseCase, RefreshUserTokenUseCase>();
    builder.Services.AddScoped<IGetCurrentUserUseCase, GetCurrentUserUseCase>();
    builder.Services.AddScoped<IUpdateUserEmailUseCase, UpdateUserEmailUseCase>();
    builder.Services.AddScoped<IUpdateUserPasswordUseCase, UpdateUserPasswordUseCase>();
    builder.Services.AddScoped<IProductRepo, ProductRepo>();
    builder.Services.AddScoped<IAddProductUseCase, AddProductUseCase>();
    builder.Services.AddScoped<IGetProductByIdUseCase, GetProductByIdUseCase>();
    builder.Services.AddScoped<IGetAllProductsUseCase, GetAllProductsUseCase>();
    builder.Services.AddScoped<IUpdateProductUseCase, UpdateProductUseCase>();
    builder.Services.AddScoped<IDeleteProductUseCase, DeleteProductUseCase>();
    builder.Services.AddScoped<IAdjustProductStockUseCase, AdjustProductStockUseCase>();
    builder.Services.AddScoped<IAddCartItemUseCase, AddCartItemUseCase>();
    builder.Services.AddScoped<ICartRepo, CartRepo>();
    
    builder.Services.AddHealthChecks()
        .AddNpgSql(connectionString, name: "postgres", tags: ["ready"]);

    builder.Services.AddProblemDetails();
    builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(o =>
    {
        o.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer"
        });
        o.OperationFilter<SecurityRequirementsOperationFilter>();
    });
    
    builder.Services.AddControllers();

    var app = builder.Build();

    app.UseSerilogRequestLogging();

    app.UseExceptionHandler();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseHttpsRedirection();
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapHealthChecks("/health/live", new HealthCheckOptions
    {
        Predicate = _ => false
    });

    app.MapHealthChecks("/health/ready", new HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains("ready")
    });
    app.MapControllers();
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
