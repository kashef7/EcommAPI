namespace Ecomm.Application.Exceptions;

public class ProductNotFoundException:AppException
{
    public  ProductNotFoundException() : base("No product found")
    {}
}