.PHONY: frontend backend start

frontend:
	cd frontend && npm run dev

backend:
	cd backend && npm run dev

start:
	@echo "Starting frontend and backend in parallel..."
	@$(MAKE) -j 2 frontend backend
