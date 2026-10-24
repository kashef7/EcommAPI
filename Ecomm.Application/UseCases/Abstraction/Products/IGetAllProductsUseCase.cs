using Ecomm.Application.Common;
using Ecomm.Application.DTOs.ProductDTO;

namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IGetAllProductsUseCase
{
    public Task<PagedResult<GetProductDTO>> ExecuteAsync(ProductQueryParamsDTO queryParams);
}