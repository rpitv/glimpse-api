import { InputType } from "@nestjs/graphql";
import { StringComparisonInput } from "../../../gql/string-comparison.input";
import { NumberComparisonInput } from "../../../gql/number-comparison.input";
import { DateComparisonInput } from "../../../gql/date-comparison.input";

/**
 * Input type for filtering BlogPosts in ReadMany queries.
 */
@InputType()
export class FilterBlogPostInput {
    /**
     * Filter by ID
     */
    id?: NumberComparisonInput;
    /**
     * Filter by when the blog post was posted.
     */
    postedAt?: DateComparisonInput;
    /**
     * Filter by title
     */
    title?: StringComparisonInput;
    /**
     * Filter by author ID
     */
    authorId?: NumberComparisonInput;
    /**
     * Filter by author display name
     */
    authorDisplayName?: StringComparisonInput;

    AND?: FilterBlogPostInput[];
    OR?: FilterBlogPostInput[];
    NOT?: FilterBlogPostInput;
}
