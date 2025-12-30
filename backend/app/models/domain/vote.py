"""Vote and ranking domain models."""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from app.models.domain.session import PhaseType


class Ranking(BaseModel):
    """A single ranking entry."""

    target_member_id: UUID
    rank: int = Field(ge=1)  # 1 = best
    score: Optional[float] = None
    reasoning: Optional[str] = None


class Vote(BaseModel):
    """A vote from a council member during peer review."""

    id: UUID = Field(default_factory=uuid4)
    session_id: UUID
    voter_member_id: UUID
    phase: PhaseType = PhaseType.REVIEW
    rankings: list[Ranking] = Field(default_factory=list)
    critique: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def get_ranking_for(self, member_id: UUID) -> Optional[Ranking]:
        """Get the ranking for a specific member."""
        for ranking in self.rankings:
            if ranking.target_member_id == member_id:
                return ranking
        return None


class AggregateRanking(BaseModel):
    """Aggregated ranking data for a council member."""

    member_id: UUID
    model_id: str
    average_rank: float = 0.0
    vote_count: int = 0
    rank_distribution: dict[int, int] = Field(default_factory=dict)  # rank -> count
    consensus_score: float = 0.0  # How much agreement there is (0-1)

    @classmethod
    def calculate(cls, member_id: UUID, model_id: str, votes: list[Vote]) -> "AggregateRanking":
        """Calculate aggregate ranking from votes."""
        rankings: list[int] = []
        rank_distribution: dict[int, int] = {}

        for vote in votes:
            ranking = vote.get_ranking_for(member_id)
            if ranking:
                rankings.append(ranking.rank)
                rank_distribution[ranking.rank] = rank_distribution.get(ranking.rank, 0) + 1

        if not rankings:
            return cls(member_id=member_id, model_id=model_id)

        average_rank = sum(rankings) / len(rankings)
        vote_count = len(rankings)

        # Calculate consensus score (higher if rankings are more consistent)
        if vote_count > 1:
            variance = sum((r - average_rank) ** 2 for r in rankings) / vote_count
            max_variance = ((len(votes) - 1) / 2) ** 2  # Max possible variance
            consensus_score = 1 - (variance / max_variance) if max_variance > 0 else 1.0
        else:
            consensus_score = 1.0

        return cls(
            member_id=member_id,
            model_id=model_id,
            average_rank=average_rank,
            vote_count=vote_count,
            rank_distribution=rank_distribution,
            consensus_score=consensus_score,
        )
