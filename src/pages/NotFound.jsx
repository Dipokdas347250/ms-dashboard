import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui/Feedback'

export default function NotFound() {
  return (
    <div className="card">
      <EmptyState
        icon="search"
        title="Page not found"
        message="The page you're looking for doesn't exist."
        action={
          <Link to="/" className="btn btn-primary">
            Back to dashboard
          </Link>
        }
      />
    </div>
  )
}
