using System.ComponentModel.DataAnnotations;

namespace Ecomm.Application.DTOs.ProductDTO;

public record ProductQueryParamsDTO()
{
    private const int MaxPageSize = 50;
    private int _pageSize = 10;

    public int PageNumber { get; set; } = 1;
    public int PageSize
    {
        get => _pageSize;
        init => _pageSize = value > MaxPageSize ? MaxPageSize : value;
    }
    
    [MaxLength(200)]
    public string? Name { get; set; }
    
    [Range(typeof(decimal), "0.01", "1000000")]
    public decimal? MinPrice { get; set;}
    
    [Range(typeof(decimal), "0.01", "1000000")]
    public decimal? MaxPrice { get; set;}
    
    [MaxLength(100)]
    public string? Tag { get; set;}

    public bool InStock { get; set; } = false;
}