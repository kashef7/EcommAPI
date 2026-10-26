using Ecomm.Application.Common;
using Ecomm.Application.DTOs.Products;

namespace Ecomm.Application.UseCases.Abstraction.Products;

public interface IGetAllProductsUseCase
{
    Task<PagedResult<GetProductDTO>> ExecuteAsync(ProductQueryParamsDTO queryParams);
}
