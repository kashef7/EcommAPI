using Ecomm.Application.Common;
using Ecomm.Application.DTOs.Products;
using Ecomm.Application.Repositories.Abstraction;
using Ecomm.Application.UseCases.Abstraction.Products;
using Ecomm.Domain.Queries.Products;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class GetAllProductsUseCase : IGetAllProductsUseCase
{
    private readonly IProductRepo _productRepo;
    private readonly ILogger<GetAllProductsUseCase> _logger;

    public GetAllProductsUseCase(IProductRepo productRepo, ILogger<GetAllProductsUseCase> logger)
    {
        _productRepo = productRepo;
        _logger = logger;
    }
    
    public async Task<PagedResult<GetProductDTO>> ExecuteAsync(ProductQueryParamsDTO queryParams)
    {
        var productQuery = new ProductQuery(
            queryParams.PageNumber,
            queryParams.PageSize,
            queryParams.Name,
            queryParams.CategoryId,
            queryParams.Tags,
            queryParams.MinPrice,
            queryParams.MaxPrice,
            queryParams.InStock,
            queryParams.OrderBy,
            queryParams.OrderDesc);

        var (products, totalCount) = await _productRepo.GetAllAsync(productQuery);

        return new PagedResult<GetProductDTO>
        {
            Items = products,
            TotalCount = totalCount,
            PageNumber = productQuery.PageNumber,
            PageSize = productQuery.PageSize
        };
    }
}
