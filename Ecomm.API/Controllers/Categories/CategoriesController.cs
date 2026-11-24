using Ecomm.Application.DTOs.Categories;
using Ecomm.Application.UseCases.Abstraction.Categories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecomm.API.Controllers.Categories;

[ApiController]
[Authorize]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly IGetAllCategoriesUseCase _getAllCategoriesUseCase;
    private readonly ICreateCategoryUseCase _createCategoryUseCase;
    private readonly IUpdateCategoryUseCase _updateCategoryUseCase;
    private readonly IDeleteCategoryUseCase _deleteCategoryUseCase;

    public CategoriesController(
        IGetAllCategoriesUseCase getAllCategoriesUseCase,
        ICreateCategoryUseCase createCategoryUseCase,
        IUpdateCategoryUseCase updateCategoryUseCase,
        IDeleteCategoryUseCase deleteCategoryUseCase)
    {
        _getAllCategoriesUseCase = getAllCategoriesUseCase;
        _createCategoryUseCase = createCategoryUseCase;
        _updateCategoryUseCase = updateCategoryUseCase;
        _deleteCategoryUseCase = deleteCategoryUseCase;
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _getAllCategoriesUseCase.ExecuteAsync();
        return Ok(categories);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> CreateCategory(CreateCategoryDTO dto)
    {
        var category = await _createCategoryUseCase.ExecuteAsync(dto);
        return Created($"/api/categories/{category.Id}", category);
    }

    [HttpPatch("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> RenameCategory(Guid id, UpdateCategoryDTO dto)
    {
        await _updateCategoryUseCase.ExecuteAsync(id, dto);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteCategory(Guid id)
    {
        await _deleteCategoryUseCase.ExecuteAsync(id);
        return NoContent();
    }
}
