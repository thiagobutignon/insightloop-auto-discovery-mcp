# EPIC: Test Infrastructure Improvements and Code Review Fixes

## Overview
Address critical feedback from PR #3 code review to improve test infrastructure quality, security coverage, and code maintainability.

**Priority:** High  
**Estimated Effort:** 2-3 days  
**PR Reference:** #3 - feat: add comprehensive E2E tests and reorganize types module

## Background
The current test suite provides good coverage but has several quality issues identified in code review:
- Overly broad exception handling reducing debuggability
- Missing security test coverage
- Inconsistent configuration and timeouts
- Incomplete performance testing implementation
- Truncated test file needs fixing

## Success Criteria
- [ ] All bare except clauses replaced with specific exception types
- [ ] Test data cleanup implemented with proper teardown
- [ ] Security tests covering common vulnerabilities added
- [ ] Performance benchmarks actually executing and reporting metrics
- [ ] All test methods have proper type hints
- [ ] Context7 setup documented and port conflicts resolved
- [ ] Test file truncation fixed and all tests passing

## Technical Tasks

### 1. Fix Exception Handling ⚠️ Critical
**File:** `run_e2e_tests.py`, `test_e2e.py`
- Replace all bare `except:` with specific exception types
- Add proper error logging with meaningful messages
- Example locations: test_e2e.py:50, run_e2e_tests.py:69, 82, 96

```python
# Current (bad):
except:
    return False

# Target (good):
except (httpx.HTTPError, json.JSONDecodeError) as e:
    logger.error(f"Test failed: {e}")
    return False
```

### 2. Implement Test Cleanup
**File:** `test_e2e.py`
- Add pytest fixtures for automatic cleanup
- Track created test resources (servers, deployments)
- Ensure no test data persists after test runs

```python
@pytest.fixture(autouse=True)
def cleanup(self):
    yield
    # Clean up test servers
    for server_id in self.test_server_ids:
        self.client.delete(f"/api/servers/{server_id}")
```

### 3. Standardize Configuration
**File:** New file `test_config.py`
- Create TestConfig class with all constants
- Standardize timeout values (currently 2s, 10s, 15s, 30s)
- Make ports configurable via environment variables

```python
class TestConfig:
    DEFAULT_TIMEOUT = 10.0
    LONG_RUNNING_TIMEOUT = 30.0
    QUICK_CHECK_TIMEOUT = 2.0
    CONTEXT7_PORT = int(os.getenv("CONTEXT7_PORT", "3700"))
    BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:8000")
```

### 4. Add Security Tests
**File:** New file `test_security.py`
- SQL injection prevention tests
- Authentication/authorization tests (when implemented)
- Input sanitization validation
- Rate limiting verification

```python
def test_sql_injection_prevention(self):
    payload = {"query": "'; DROP TABLE servers; --"}
    response = self.client.post("/api/discover", json=payload)
    assert response.status_code in [200, 400]
    # Verify no actual SQL execution occurred
    
def test_xss_prevention(self):
    payload = {"name": "<script>alert('xss')</script>"}
    response = self.client.post("/api/register", json=payload)
    # Verify sanitization
```

### 5. Fix Truncated Test File
**File:** `test_e2e.py`
- Complete the truncated test methods (line 573+)
- Ensure all async tests properly decorated with @pytest.mark.asyncio
- Verify all tests execute successfully

### 6. Refactor Colors Class
**File:** `run_e2e_tests.py`
- Convert Colors class to proper enum
- Use IntEnum or StrEnum for better type safety

```python
from enum import Enum

class Colors(Enum):
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'
```

### 7. Add Type Hints
**Files:** `test_e2e.py`, `run_e2e_tests.py`
- Add comprehensive type hints to all methods
- Use typing module for complex types
- Enable mypy checking for test files

```python
def test_discover_servers(self) -> None:
    ...

async def test_orchestrate_task(self, server_id: str) -> bool:
    ...
```

### 8. Implement Performance Tests
**File:** New file `test_performance.py`
- Set up Locust for load testing
- Create performance test scenarios
- Implement memory profiling
- Add performance regression detection

```python
from locust import HttpUser, task, between

class MCPUser(HttpUser):
    wait_time = between(1, 3)
    
    @task
    def discover_servers(self):
        self.client.post("/api/discover", json={"query": "mcp"})
```

### 9. Document Context7 Setup
**File:** Update `TEST_DOCUMENTATION.md`
- Add detailed Context7 installation instructions
- Provide Docker compose example
- Include troubleshooting for common setup issues

### 10. Configure Port Management
**File:** `test_config.py`, update test files
- Make all ports configurable via environment
- Add port availability checking before tests
- Implement fallback port selection

## Acceptance Criteria
- [ ] All tests pass with `pytest test_e2e.py -v`
- [ ] No bare except clauses remain in codebase
- [ ] Security tests demonstrate vulnerability prevention
- [ ] Performance tests generate meaningful metrics
- [ ] Type checking passes with `mypy test_*.py`
- [ ] Documentation includes complete setup instructions
- [ ] Code review feedback fully addressed

## Dependencies
- pytest-cov for coverage reporting
- locust for performance testing
- mypy for type checking
- pytest-asyncio for async test support

## Timeline
- Day 1: Fix critical issues (exceptions, truncation, cleanup)
- Day 2: Add security tests and performance framework
- Day 3: Documentation, type hints, and final validation

## Notes
- Prioritize fixing the truncated test file first as it blocks other testing
- Security tests are critical for production readiness
- Consider CI/CD integration after these improvements