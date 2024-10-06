import functools
from django.http import JsonResponse
from rest_framework import status
from django.http import Http404
from typing import Any, Callable
from functools import wraps
import time
import datetime
from utils import Color

class BadRequestError(Exception): # 400
    pass


class ForbiddenError(Exception): # 403
    pass


class NotFoundError(Exception):
    pass

def HandleExceptions(func: Callable) -> Callable:
    @wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        try:
            return func(*args, **kwargs)
        except BadRequestError as e:
            return ErrorResponse(str(e), status=400)  # Adjust status as needed
        except Http404 as e:
            return ErrorResponse(str(e), status=404)
        except ValueError as e:
            return ErrorResponse(str(e), status=404)
        except ForbiddenError as e:
            return ErrorResponse(str(e), status=403)
        except Exception as e:
            return ErrorResponse(str(e), status=500)
    return wrapper


def Controller(func):
    # future use of multiple decorators:
    # method3(method2(handle_exceptions(func)))
    return HandleExceptions(func)


def ErrorResponse(error, status):

    def parse_error(error):
        """
        Rules to parse the error message
        """
        error_message = error.replace('\"', "'")
        return error_message

    if not isinstance(error, dict):
        return JsonResponse({"error": error}, status=status)

    errors = {"error": {}}
    for key, value in error.items():
        if isinstance(value, str):
            error_message = parse_error(value)
        elif isinstance(value, list):
            error_message = [parse_error(item) for item in value]
        else:
            error_message = value

        errors["error"][key] = error_message

    return JsonResponse(errors, status=status)