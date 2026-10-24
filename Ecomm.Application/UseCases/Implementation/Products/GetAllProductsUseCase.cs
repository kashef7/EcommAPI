using Ecomm.Application.Common;
using Ecomm.Application.DTOs.ProductDTO;
using Ecomm.Application.Repositories.Abstraction.IProductRepo;
using Ecomm.Application.UseCases.Abstraction.Products;
using Ecomm.Domain.Query.Product;
using Microsoft.Extensions.Logging;

namespace Ecomm.Application.UseCases.Implementation.Products;

public class GetAllProductsUseCase: IGetAllProductsUseCase
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
        var productQuery = new ProductQuery(queryParams.PageNumber, queryParams.PageSize, queryParams.Name,
            queryParams.Tag, queryParams.MinPrice, queryParams.MaxPrice, queryParams.InStock);
        var (products, totalCount) = await _productRepo.GetAllAsync(productQuery);
        IReadOnlyList<GetProductDTO> productDtos = products
            .Select(p => new GetProductDTO(
                p.Id,
                p.Name,
                p.Description,
                p.ImageUrl,
                p.Tag,
                p.Price,
                p.StockQuantity,
                p.CreatedAt
            )).ToList();
        return new PagedResult<GetProductDTO>
        {
            Items = productDtos,
            TotalCount = totalCount,
            PageNumber = productQuery.PageNumber,
            PageSize = productQuery.PageSize
        };
    }
}