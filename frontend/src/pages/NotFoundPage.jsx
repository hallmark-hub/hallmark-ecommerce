import { Link } from 'react-router-dom'
import Button from '../components/Button'

export default function NotFoundPage() {
  return (
    <main className="pt-20 min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center px-gutter">
        <p className="text-[96px] font-bold text-primary-fixed-dim leading-none">404</p>
        <h1 className="text-h2 font-medium text-on-surface mb-sm mt-md">Page Not Found</h1>
        <p className="text-body text-secondary mb-xl">The page you're looking for doesn't exist or was moved.</p>
        <Link to="/"><Button variant="primary" size="lg">Back to Home</Button></Link>
      </div>
    </main>
  )
}
